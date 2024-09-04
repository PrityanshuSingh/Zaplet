import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  CircleStop,
  Filter,
  Loader2,
  MapIcon,
  MessageCircle,
  NotebookPen,
  SendHorizonal,
  Share2,
  Trash,
  UserCircle,
  Heart,
  Sparkles,
  Mic,
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { set, z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Toaster } from "../components/ui/toaster";
import { toast } from "../components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { APIProvider, ControlPosition, Map } from "@vis.gl/react-google-maps";
import { CustomMapControl } from "../mapcontrol";
import MapHandler from "../maphandler";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { Textarea } from "../components/ui/textarea";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp";
import { Badge } from "../components/ui/badge";
import { useTour } from "@reactour/tour";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import logo from "../assets/logo.png";
import UmamiTrack from "../lib/umami";

interface PropertyModel {
  name: string;
  url: string;
  contacted: boolean;
  property_tag: string;
}

function App() {
  const [query, setQuery] = useState("");
  const [basisQuery, setBasisQuery] = useState("");
  const examples = [
    "Find me charming homes in low-crime neighborhoods.",
    "I have a dog, so show me cozy homes near parks.",
    "Show me properties that feature a bathtub.",
    "I'm a gym enthusiast, so find me properties with easy access to fitness facilities.",
    "I want to live near my friends. Show me homes for both of us in the same neighborhood.",
  ];
  const screenWidth = useRef(0);
  const [inProgress, setInProgress] = useState(false);
  const [showLoginAuth, setShowLoginAuth] = useState(false);
  const [showRegisterAuth, setShowRegisterAuth] = useState(false);
  const [showContactAgent, setShowContactAgent] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [contactUrl, setContactUrl] = useState("");
  const [chat, setChat] = useState<ReactNode[]>([]);
  const stopChat = useRef(false);
  const [showMap, setShowMap] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMobileSavedProperties, setShowMobileSavedProperties] =
    useState(false);
  const [showCompareBasis, setShowCompareBasis] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { role: string; content: string }[]
  >([]);
  const [disabled, setDisabled] = useState(false);
  const [auth, setAuth] = useState(false);
  const [savedProperties, setSavedProperties] = useState<PropertyModel[]>([]);
  const savedPropertiesRef = useRef<PropertyModel[]>([]);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  Fancybox.bind('[data-fancybox="galleryBox"]', {});

  const { setIsOpen } = useTour();

  const area = useRef<string>();
  const closeTo = useRef<string>();
  const maxPrice = useRef<number>();
  const minPrice = useRef<number>();
  const bedrooms = useRef<number>();
  const furnishing = useRef<string>("");
  const pincode = useRef<string>();
  const bills = useRef();
  const lowCrimeRate = useRef();
  const bigWindows = useRef();
  const quietNeighbourhood = useRef();
  const shareableProperties = useRef<string[]>([]);

  const buttonUrls = [
    "www.winkworth.co.uk",
    "search.savills.com",
    "www.knightfrank.co.uk",
    "www.hamptons.co.uk",
    "www.kfh.co.uk",
    "www.chestertons.co.uk",
    "www.dexters.co.uk",
  ];

  const [recordingTime, setRecordingTime] = useState<string>();
  const [recording, setRecording] = useState(false);
  const [silenceTimeout, setSilenceTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const mediaStream = useRef<MediaStream>();
  const mediaRecorder = useRef<MediaRecorder>();
  const chunks = useRef<Blob[]>([]);

  const backendUrl = import.meta.env.VITE_BACKEND;

  useEffect(() => {
    const property_id = window.location.pathname.split("/")[2];
    if (property_id != undefined) {
      setQuery("Show me the property with id " + property_id);
      handleQuery(undefined, "Show me the property with id " + property_id);
      window.history.pushState({}, "", window.location.origin);
      window.history.replaceState({}, "", window.location.origin);
    }
    screenWidth.current = window.innerWidth;
    if (localStorage.getItem("first_run") === null) {
      setIsOpen(true);
    }
    if (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_verified="))
        ?.split("=")[1] !== undefined &&
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_verified="))
        ?.split("=")[1] !== "false"
    ) {
      const email = document.cookie
        .split("; ")
        .find((row) => row.startsWith("email="))
        ?.split("=")[1];
      //@ts-expect-error umami is loaded on client
      umami.identify({ email: email });
      localStorage.removeItem("saved_properties");
      localStorage.removeItem("agent_properties");
      setAuth(true);
      get_saved_properties(true);
      // get_user_requested_properties(true);
    } else {
      if (
        localStorage.getItem("saved_properties") == null ||
        localStorage.getItem("agent_properties") == null
      ) {
        localStorage.setItem("saved_properties", JSON.stringify([]));
        localStorage.setItem("agent_properties", JSON.stringify([]));
      }
      //@ts-expect-error umami is loaded on client
      umami.identify({ email: "guest" });
      get_saved_properties();
      // get_user_requested_properties();
    }
    const elem: HTMLElement | null = document.querySelector(
      ".my-scroll-area > div > div"
    );
    if (elem) elem.style.display = "block";
  }, []);

  const lookup_property = async (url: string) => {
    const response = await fetch(`${backendUrl}/api/lookup_property`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: url }),
    });
    if (response.ok) {
      const data = await response.json();
      return [data["property"], data["property_tag"]];
    }
    return "";
  };

  const get_saved_properties = async (force = false) => {
    if (auth || force) {
      const response = await fetch(`${backendUrl}/api/get_saved_properties`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      setSavedProperties(data["properties"].reverse());
      savedPropertiesRef.current = data["properties"].reverse();
    } else {
      setSavedProperties(JSON.parse(localStorage.getItem("saved_properties")!));
      savedPropertiesRef.current = JSON.parse(
        localStorage.getItem("saved_properties")!
      );
    }
  };

  const save_properties = async (property: string, force = false) => {
    if (auth || force) {
      const response = await fetch(`${backendUrl}/api/save_property`, {
        method: "POST",
        body: JSON.stringify({ text: property }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        get_saved_properties();
        toast({
          description: data["message"],
          className: "bg-green-300 font-semibold text-black",
        });
      } else {
        toast({
          variant: "destructive",
          description: data["message"],
          className: "font-bold",
        });
      }
    } else {
      const saved_properties = JSON.parse(
        localStorage.getItem("saved_properties")!
      );
      if (
        saved_properties.filter((i: PropertyModel) => i["url"] == property)
          .length === 0
      ) {
        const [property_name, property_tag] = await lookup_property(property);
        if (property_name != "") {
          saved_properties.push({
            name: property_name,
            url: property,
            property_tag: property_tag,
          });
          localStorage.setItem(
            "saved_properties",
            JSON.stringify(saved_properties.reverse())
          );
          get_saved_properties();
          toast({
            description: "Property saved successfully",
            className: "bg-green-300 font-semibold text-black",
          });
        }
      }
    }
  };

  const delete_saved_property = async (property: string) => {
    if (auth) {
      const response = await fetch(`${backendUrl}/api/delete_property`, {
        method: "DELETE",
        body: JSON.stringify({ text: property }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        get_saved_properties();
        toast({
          description: data["message"],
          className: "bg-green-300 font-semibold text-black",
        });
      } else {
        toast({
          variant: "destructive",
          description: data["message"],
          className: "font-bold",
        });
      }
    } else {
      let saved_properties = JSON.parse(
        localStorage.getItem("saved_properties")!
      );
      saved_properties = saved_properties.filter(
        (i: PropertyModel) => i.url != property
      );
      localStorage.setItem(
        "saved_properties",
        JSON.stringify(saved_properties.reverse())
      );
      get_saved_properties();
    }
  };

  // const get_user_requested_properties = async (force = false) => {
  //   if (auth || force) {
  //     const response = await fetch(
  //       "http://192.168.0.111:8000/api/get_user_requested_properties",
  //       {
  //         method: "GET",
  //         credentials: "include",
  //       },
  //     );
  //     const data = await response.json();
  //     setuserRequestedProperties(data["properties"].reverse());
  //   } else {
  //     setuserRequestedProperties(
  //       JSON.parse(localStorage.getItem("agent_properties")!),
  //     );
  //   }
  // };
  //
  // const save_user_requested_properties = async (
  //   property: string,
  //   force = false,
  // ) => {
  //   if (auth || force) {
  //     const response = await fetch(
  //       "http://192.168.0.111:8000/api/save_user_requested_property",
  //       {
  //         method: "POST",
  //         body: JSON.stringify({ text: property }),
  //         headers: { "Content-Type": "application/json" },
  //         credentials: "include",
  //       },
  //     );
  //     const data = await response.json();
  //     if (response.ok) {
  //       get_user_requested_properties();
  //       toast({
  //         description: data["message"],
  //         className: "bg-green-300 font-semibold text-black",
  //       });
  //     } else {
  //       toast({
  //         variant: "destructive",
  //         description: data["message"],
  //         className: "font-bold",
  //       });
  //     }
  //   } else {
  //     const agent_properties = JSON.parse(
  //       localStorage.getItem("agent_properties")!,
  //     );
  //     if (
  //       agent_properties.filter((i: PropertyModel) => i["url"] == property)
  //         .length === 0
  //     ) {
  //       const property_name = await lookup_property(property);
  //       if (property_name != "") {
  //         agent_properties.push({ name: property_name, url: property });
  //         localStorage.setItem(
  //           "agent_properties",
  //           JSON.stringify(agent_properties.reverse()),
  //         );
  //         get_user_requested_properties();
  //         toast({
  //           description: "Property saved successfully",
  //           className: "bg-green-300 font-semibold text-black",
  //         });
  //       }
  //     }
  //   }
  // };
  //
  // const delete_user_requested_property = async (property: string) => {
  //   if (auth) {
  //     const response = await fetch(
  //       "http://192.168.0.111:8000/api/delete_user_requested_property",
  //       {
  //         method: "DELETE",
  //         body: JSON.stringify({ text: property }),
  //         headers: { "Content-Type": "application/json" },
  //         credentials: "include",
  //       },
  //     );
  //     const data = await response.json();
  //     if (response.ok) {
  //       get_user_requested_properties();
  //       toast({
  //         description: data["message"],
  //         className: "bg-green-300 font-semibold text-black",
  //       });
  //     } else {
  //       toast({
  //         variant: "destructive",
  //         description: data["message"],
  //         className: "font-bold",
  //       });
  //     }
  //   } else {
  //     let agent_properties = JSON.parse(
  //       localStorage.getItem("agent_properties")!,
  //     );
  //     agent_properties = agent_properties.filter(
  //       (i: PropertyModel) => i.url != property,
  //     );
  //     localStorage.setItem(
  //       "agent_properties",
  //       JSON.stringify(agent_properties.reverse()),
  //     );
  //     get_user_requested_properties();
  //   }
  // };
  //
  const contact_agent = async (
    values: z.infer<typeof contactAgentFormSchema>
  ) => {
    setInProgress(true);
    const response = await fetch(`${backendUrl}/api/contact_agent`, {
      method: "POST",
      body: JSON.stringify({
        text: "",
        name: values.name,
        number: values.number,
        message: values.message,
        url: contactUrl,
      }),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const data = await response.json();
    if (response.ok) {
      // get_user_requested_properties();
      toast({
        description: data["message"],
        className: "bg-green-300 font-semibold text-black",
      });
      setShowContactAgent(false);
      contactAgentForm.reset();
    } else {
      toast({
        variant: "destructive",
        description: data["message"],
        className: "font-bold",
      });
    }
    setInProgress(false);
  };

  const loginFormSchema = z.object({
    email: z
      .string({
        required_error: "Email is required",
        invalid_type_error: "Invalid email, check again",
      })
      .email({ message: "Invalid email, check again" }),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(8, { message: "Password must be at least 8 characters" }),
  });

  const registerFormSchema = z
    .object({
      email: z
        .string({
          required_error: "Email is required",
          invalid_type_error: "Invalid email, check again",
        })
        .email({ message: "Invalid email, check again" }),
      password: z
        .string({
          required_error: "Password is required",
        })
        .min(8, { message: "Password must be at least 8 characters" }),
      confirmPassword: z
        .string({
          required_error: "Confirm Password is required",
        })
        .min(8, { message: "Password must be at least 8 characters" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords don't match",
    });

  const contactAgentFormSchema = z.object({
    name: z.string({
      required_error: "name is required",
      invalid_type_error: "Invalid email, check again",
    }),
    number: z.coerce.number({
      required_error: "Number is required",
    }),
    message: z.string({
      required_error: "Message is required",
    }),
  });

  const otpFormSchema = z.object({
    otp: z.string().min(6, {
      message: "Your one-time password must be 6 characters.",
    }),
  });

  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
  });

  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
  });

  const contactAgentForm = useForm<z.infer<typeof contactAgentFormSchema>>({
    resolver: zodResolver(contactAgentFormSchema),
    defaultValues: { message: "I am interested in viewing this property" },
  });

  const otpForm = useForm<z.infer<typeof otpFormSchema>>({
    resolver: zodResolver(otpFormSchema),
  });

  const filterApply = () => {
    setShowFilter(false);
    const includeArea = area.current == undefined ? false : true;
    const includeCloseTo = closeTo.current == undefined ? false : true;
    const includeMinPrice = minPrice.current == undefined ? false : true;
    const includeMaxPrice = maxPrice.current == undefined ? false : true;
    const includeBedrooms = bedrooms.current == undefined ? false : true;
    const includeFurnishing = furnishing.current == "" ? false : true;
    const includeBills =
      bills.current == undefined || bills.current == false ? false : true;
    const includeLowCrimeRate =
      lowCrimeRate.current == undefined || lowCrimeRate.current == false
        ? false
        : true;
    const includePincode =
      pincode.current == undefined || lowCrimeRate.current == false
        ? false
        : true;
    const includeBigWindows =
      bigWindows.current == undefined || bigWindows.current == false
        ? false
        : true;
    const includeQuietNeighbourhood =
      quietNeighbourhood.current == undefined ||
      quietNeighbourhood.current == false
        ? false
        : true;

    UmamiTrack("filter", {
      "filter-prompt":
        "Show " +
        (includeFurnishing ? `${furnishing.current} ` : "") +
        "properties  " +
        (includeArea ? `near ${area.current} ` : "") +
        (includeCloseTo ? `close to ${closeTo.current} ` : "") +
        (includeMinPrice ? `minimum price ${minPrice.current} ` : "") +
        (includeMaxPrice ? `maximum price ${maxPrice.current} ` : "") +
        (includeBedrooms ? `bedrooms ${bedrooms.current} ` : "") +
        (includePincode ? `pincode ${pincode.current} ` : "") +
        (includeBills ? `bills included ` : "") +
        (includeLowCrimeRate ? `with low crime rate ` : "") +
        (includeBigWindows ? `with big windows ` : "") +
        (includeQuietNeighbourhood ? `with quiet neighbourhood ` : ""),
    });
    handleQuery(
      undefined,
      "Show " +
        (includeFurnishing ? `${furnishing.current} ` : "") +
        "properties  " +
        (includeArea ? `near ${area.current} ` : "") +
        (includeCloseTo ? `close to ${closeTo.current} ` : "") +
        (includeMinPrice ? `minimum price ${minPrice.current} ` : "") +
        (includeMaxPrice ? `maximum price ${maxPrice.current} ` : "") +
        (includeBedrooms ? `bedrooms ${bedrooms.current} ` : "") +
        (includePincode ? `pincode ${pincode.current} ` : "") +
        (includeBills ? `bills included ` : "") +
        (includeLowCrimeRate ? `with low crime rate ` : "") +
        (includeBigWindows ? `with big windows ` : "") +
        (includeQuietNeighbourhood ? `with quiet neighbourhood ` : "")
    );
  };

  const syncLocalStorage = () => {
    const saved_properties = JSON.parse(
      localStorage.getItem("saved_properties")!
    );
    // const agent_properties = JSON.parse(
    //   localStorage.getItem("agent_properties")!,
    // );
    for (const i of saved_properties) {
      save_properties(i["url"], true);
    }
    // for (const i of agent_properties) {
    //   save_user_requested_properties(i["url"], true);
    // }
  };

  async function onSubmitLogin(values: z.infer<typeof loginFormSchema>) {
    setInProgress(true);
    const response = await fetch(`${backendUrl}/api/login`, {
      method: "POST",
      body: JSON.stringify({ email: values.email, password: values.password }),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const data = await response.json();
    if (response.ok) {
      UmamiTrack("login", {
        "login-email": values.email,
      });
      toast({
        description: data["message"],
        className: "bg-green-300 font-semibold text-black",
      });
      loginForm.reset();
      document.cookie = "auth_verified=true;max-age=2505600";
      document.cookie = "email=" + values.email + ";max-age=2505600";
      setAuth(true);
      syncLocalStorage();
      window.location.reload();
      get_saved_properties();
      // get_user_requested_properties();
      setShowLoginAuth(false);
    } else {
      toast({
        variant: "destructive",
        description: data["message"],
        className: "font-semibold",
      });
    }
    setInProgress(false);
  }

  async function onSubmitRegister(values: z.infer<typeof registerFormSchema>) {
    setInProgress(true);
    setOtpEmail(values.email);
    const response = await fetch(`${backendUrl}/api/register`, {
      method: "POST",
      body: JSON.stringify({ email: values.email, password: values.password }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (response.ok) {
      UmamiTrack("register", {
        "register-email": values.email,
      });
      toast({
        description: data["message"],
        className: "bg-green-300 font-semibold",
      });
      setShowRegisterAuth(false);
      setShowOtp(true);
    } else {
      toast({
        variant: "destructive",
        description: data["message"],
        className: "font-semibold",
      });
    }
    setInProgress(false);
  }

  async function otpVerification(values: z.infer<typeof otpFormSchema>) {
    setInProgress(true);
    const response = await fetch(`${backendUrl}/api/verify`, {
      method: "POST",
      body: JSON.stringify({ email: otpEmail, otp: values.otp }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (response.ok) {
      UmamiTrack("otp", {
        "otp-email": otpEmail,
      });
      toast({
        description: data["message"],
        className: "bg-green-300 font-semibold",
      });
      setShowOtp(false);
      setShowLoginAuth(true);
    } else {
      toast({
        variant: "destructive",
        description: data["message"],
        className: "font-semibold",
      });
    }
    setInProgress(false);
  }

  interface UserMessageComponentProps {
    message: string;
  }

  interface AIMessageComponentProps {
    history: { role: string; content: string }[];
    message: ReadableStream<Uint8Array>;
  }

  const AIMessageComponent = ({
    message,
    history,
  }: AIMessageComponentProps) => {
    const [text, setText] = useState("");
    const [progress, setProgress] = useState(true);
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    let stopUpdating = false;
    // const componentRef = useRef(null);
    const temp = useRef("");
    const decoder = new TextDecoder();

    const updateTextLoop = async () => {
      while (!stopUpdating) {
        setText(temp.current);
        await delay(500);
      }
      setText(temp.current);
    };

    async function* streamToAsyncIterator(
      stream: ReadableStream<Uint8Array>
    ): AsyncIterableIterator<Uint8Array> {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          if (value) {
            yield value;
          }
        }
      } finally {
        reader.releaseLock();
      }
    }

    const readMessage = useCallback(async () => {
      updateTextLoop();
      for await (const chunk of streamToAsyncIterator(message)) {
        temp.current += decoder.decode(chunk, { stream: true });

        if (stopChat.current) {
          stopUpdating = true;
          stopChat.current = false;
          setProgress(false);
          setDisabled(false);
          setChatHistory([
            ...history,
            { role: "assistant", content: temp.current },
          ]);
          return;
        }

        // if (viewportAutoScroll.current) {
        //   viewportRef.current?.scrollBy({ top: 1000, behavior: "instant" });
        // }
        // componentRef.current.scrollIntoView({
        //   behavior: "instant",
        //   block: "end",
        // });
      }
      stopUpdating = true;
      setDisabled(false);
      setChatHistory([
        ...history,
        { role: "assistant", content: temp.current },
      ]);
    }, []);

    useEffect(() => {
      readMessage();
    }, []);

    return (
      <>
        <div className="flex items-start gap-3 mb-5">
          <div className="prose prose-invert p-4 bg-gray-700 !text-white rounded-lg max-w-[95%] md:max-w-[80%] marker:text-white">
            {text === "" ? (
              <div className="flex gap-1 items-center">
                <Loader2
                  className={`mr-2 h-6 w-6 animate-spin ${
                    progress ? "block" : "hidden"
                  } `}
                />
                Generating Response...
              </div>
            ) : (
              <Markdown
                children={text}
                components={{
                  img(props) {
                    const { children, src, alt, ...rest } = props;
                    return (
                      <a
                        href={src}
                        data-fancybox="galleryBox"
                        data-caption={alt}
                        className="w-full flex-shrink-0"
                      >
                        <img src={src} alt={alt} {...rest}>
                          {children}
                        </img>
                      </a>
                    );
                  },
                  div(props) {
                    const { children, className } = props;
                    if (className?.includes("carousel")) {
                      return <Carousel>{children}</Carousel>;
                    } else {
                      return <div className={className}>{children}</div>;
                    }
                  },
                  a(props) {
                    const { children, href, ...rest } = props;
                    return (
                      <>
                        {new URL(href!).pathname.split("/")[1] === "map" ? (
                          <MapIcon
                            className="inline-flex hover:cursor-pointer"
                            onClick={() => {
                              const latlon = new URL(href!).pathname.split(
                                "/"
                              )[2];
                              const lat = parseFloat(latlon.split(",")[0]);
                              const lng = parseFloat(latlon.split(",")[1]);
                              setSelectedPlace(null);
                              setLatitude(lat);
                              setLongitude(lng);
                              if (screenWidth.current < 1024) {
                                setShowMap(true);
                              }
                            }}
                          />
                        ) : (
                          <>
                            <a href={href} target="_blank" {...rest}>
                              {children}
                            </a>
                            {buttonUrls.includes(new URL(href!).host) && (
                              <LikeComponent url={href!} />
                            )}
                          </>
                        )}
                      </>
                    );
                  },
                  table(props) {
                    const { children, ...rest } = props;
                    return (
                      <>
                        <ScrollArea className="overflow-auto w-[99%]">
                          <table
                            {...rest}
                            className={
                              "border-collapse border-gray-500 border-2"
                            }
                          >
                            {children}
                          </table>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      </>
                    );
                  },
                  th(props) {
                    const { children, ...rest } = props;
                    return (
                      <th
                        {...rest}
                        className={"border-gray-500 p-3 border-2 text-white"}
                      >
                        {children}
                      </th>
                    );
                  },
                  td(props) {
                    const { children, ...rest } = props;
                    return (
                      <td
                        {...rest}
                        className={"border-gray-500 p-3 border-2 text-white"}
                      >
                        {children}
                      </td>
                    );
                  },
                }}
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
              />
            )}
          </div>
        </div>
      </>
    );
  };

  const UserMessageComponent = ({ message }: UserMessageComponentProps) => {
    return (
      <div className="flex items-start gap-3 justify-end mb-5">
        <div className="bg-blue-500 rounded-lg p-3 max-w-[70%] text-white">
          <p className="text-sm">{message}</p>
        </div>
      </div>
    );
  };

  const FilterComponent = () => {
    return (
      <ScrollArea className="h-[500px]">
        <div className="flex flex-wrap p-3 gap-5">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="area" className="text-white font-semibold">
              Area
            </Label>
            <Input
              id="area"
              type="text"
              placeholder="Westminster, Camden"
              className="text-black"
              defaultValue={area.current}
              onChange={(v) => {
                area.current = v.target.value;
              }}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="area" className="text-white font-semibold">
              Close To
            </Label>
            <Input
              id="area"
              type="text"
              placeholder="Tesco, Parks, Hospitals, Golder Green Tube Station"
              className="text-black"
              defaultValue={closeTo.current}
              onChange={(v) => {
                closeTo.current = v.target.value;
              }}
            />
          </div>
          <div className="grid grid-cols-2 w-full gap-5">
            <div className="grid items-center gap-1.5">
              <Label htmlFor="price" className="text-white font-semibold">
                Min Price (£)
              </Label>
              <Input
                id="price"
                type="number"
                className="text-black"
                placeholder="700,800"
                defaultValue={minPrice.current}
                onChange={(v) => (minPrice.current = parseInt(v.target.value))}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="price" className="text-white font-semibold">
                Max Price (£)
              </Label>
              <Input
                id="price"
                type="number"
                className="text-black"
                placeholder="1500,2000"
                value={maxPrice.current}
                onChange={(v) => (maxPrice.current = parseInt(v.target.value))}
              />
            </div>
          </div>
          <div className="grid flex-1  items-center gap-1.5">
            <Label htmlFor="bedroom" className="text-white font-semibold">
              Bedrooms
            </Label>
            <Input
              id="bedroom"
              type="number"
              className="text-black"
              placeholder="No. of Bedrooms"
              defaultValue={bedrooms.current}
              onChange={(v) => (bedrooms.current = parseInt(v.target.value))}
            />
          </div>
          <div className="grid  items-center gap-1.5">
            <Label htmlFor="area" className="text-white font-semibold">
              Postcode
            </Label>
            <Input
              id="area"
              type="text"
              placeholder="SE145RQ, SW63JS"
              className="text-black"
              defaultValue={pincode.current}
              onChange={(v) => {
                pincode.current = v.target.value;
              }}
            />
          </div>
          <div className="grid w-[180px] items-center gap-1.5">
            <Label htmlFor="furnishing" className="text-white font-semibold">
              Furnishing
            </Label>
            <Select
              onValueChange={(v) => (furnishing.current = v.valueOf())}
              defaultValue={furnishing.current}
            >
              <SelectTrigger className="w-[180px] text-black">
                <SelectValue placeholder="Furnished/Unfurnished" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="furnished">Furnished</SelectItem>
                  <SelectItem value="unfurnished">Unfurnished</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bill"
              className="border-white"
              defaultValue={bills.current}
              //@ts-expect-error breaks input
              onCheckedChange={(v) => (bills.current = v.valueOf())}
            />
            <label
              htmlFor="bill"
              className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
            >
              Bills Included
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="crime"
              className="border-white"
              defaultValue={lowCrimeRate.current}
              //@ts-expect-error breaks input
              onCheckedChange={(v) => (lowCrimeRate.current = v.valueOf())}
            />
            <label
              htmlFor="crime"
              className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
            >
              Low Crime Rate
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="windows"
              className="border-white"
              defaultValue={bigWindows.current}
              //@ts-expect-error breaks input
              onCheckedChange={(v) => (bigWindows.current = v.valueOf())}
            />
            <label
              htmlFor="windows"
              className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
            >
              Big Windows
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="quiet"
              className="border-white"
              defaultValue={quietNeighbourhood.current}
              onCheckedChange={(v) =>
                //@ts-expect-error breaks input
                (quietNeighbourhood.current = v.valueOf())
              }
            />
            <label
              htmlFor="quiet"
              className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
            >
              Quiet Neighbourhood
            </label>
          </div>
        </div>
      </ScrollArea>
    );
  };

  const CompareButton = () => {
    return (
      <Button
        className="mt-3 w-full bg-[#0073EC] hover:bg-blue-700 font-bold lg:w-fit lg:mt-2"
        disabled={disabled}
        onClick={() => {
          setShowMobileSavedProperties(false);
          if (!auth) {
            if (
              localStorage.getItem("count") == null ||
              Number.parseInt(
                //@ts-expect-error count null
                localStorage.getItem("count")
              ) < 3
            ) {
              if (localStorage.getItem("count") == null) {
                localStorage.setItem("count", "1");
              } else {
                const count = Number.parseInt(localStorage.getItem("count")!);
                localStorage.setItem("count", (count + 1).toString());
              }
            } else {
              toast({
                variant: "destructive",
                description: "Login to access this feature",
                className: "font-semibold text-white",
              });
              setShowLoginAuth(true);
              return;
            }
          }
          setShowCompareBasis(true);
        }}
      >
        Compare
      </Button>
    );
  };

  interface CarouselProps {
    children: ReactNode;
  }

  const Carousel = ({ children }: CarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalSlides, setTotalSlides] = useState(0);
    const carouselRef = useRef(null);

    useEffect(() => {
      if (carouselRef.current) {
        //@ts-expect-error ref is initialized with null so
        setTotalSlides(carouselRef.current.children.length);
      }
    }, []);

    const nextSlide = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    };

    const prevSlide = () => {
      setCurrentIndex(
        (prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides
      );
    };

    return (
      <div className="relative w-full max-w-2xl h-[300px] lg:h-[450px] overflow-hidden">
        <div
          ref={carouselRef}
          className="carousel flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {children}
        </div>
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-gray-800 text-white rounded-full"
        >
          &#10094;
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-gray-800 text-white rounded-full"
        >
          &#10095;
        </button>
      </div>
    );
  };

  const LikeComponent = (props: { url: string }) => {
    const [isSaved, setIsSaved] = useState(
      savedPropertiesRef.current.some((i) => props.url === i.url)
    );

    return (
      <Heart
        className={`ml-2 inline-block cursor-pointer ${
          isSaved ? "fill-red-500 stroke-red-500" : ""
        }`}
        onClick={() => {
          if (isSaved) {
            delete_saved_property(props.url);
            setIsSaved(false);
          } else {
            save_properties(props.url);
            setIsSaved(true);
          }
          setIsSaved(!isSaved);
        }}
      />
    );
  };

  const startRecording = async () => {
    const computeVolume = (amplitudeArray: Float32Array): number => {
      const values = amplitudeArray.reduce(
        (sum, value) => sum + value * value,
        0
      );
      const average = Math.sqrt(values / amplitudeArray.length);
      const volume = 20 * Math.log10(average);
      return volume;
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      const audioContext = new AudioContext();
      const microphone = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.minDecibels = -100;
      microphone.connect(analyser);

      const bufferLength = analyser.fftSize;
      const amplitudeArray = new Float32Array(bufferLength || 0);
      analyser.getFloatTimeDomainData(amplitudeArray);

      const checkSilence = () => {
        if (!silenceTimeout) {
          setSilenceTimeout(
            setTimeout(() => {
              const amplitudeArray = new Float32Array(bufferLength || 0);
              analyser.getFloatTimeDomainData(amplitudeArray);
              const volume = computeVolume(amplitudeArray);
              if (volume < -55) {
                stopRecording();
                setSilenceTimeout(null);
              } else {
                checkSilence();
              }
            }, 3000)
          );
        }
      };

      checkSilence();

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      let recordingLengthInterval: NodeJS.Timeout;

      const formatTime = (timeInMillis: number) => {
        const totalSeconds = Math.floor(timeInMillis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        setRecordingTime(
          `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
            2,
            "0"
          )}`
        );
      };

      mediaRecorder.current.onstart = () => {
        recordingLengthInterval = setInterval(() => {
          const elapsedTime = Date.now() - startTime;
          formatTime(elapsedTime);
        }, 1000);
      };

      mediaRecorder.current.onstop = async () => {
        analyser.disconnect();
        microphone.disconnect();
        audioContext.close();

        clearInterval(recordingLengthInterval);
        setRecordingLoading(true);

        const recordedBlob = new Blob(chunks.current, { type: "audio/webm" });
        const data = new FormData();
        data.append("file", recordedBlob, "audio.webm");
        const response = await fetch(`${backendUrl}/api/sst`, {
          method: "POST",
          body: data,
        });
        if (response.ok) {
          const data = await response.json();
          handleQuery(undefined, data["text"]);
          UmamiTrack("voice", {
            "voice-prompt": data["text"],
          });
          setRecordingLoading(false);
          setRecording(false);
        }
        chunks.current = [];
      };

      const startTime = Date.now();

      mediaRecorder.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };
  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => {
        track.stop();
      });
    }
  };

  useEffect(() => {
    const storedSearchQuery = localStorage.getItem("searchQuery");
    let queryPrompt = query;

    if (storedSearchQuery) {
      const searchQuery = JSON.parse(storedSearchQuery);
      queryPrompt = `Find me rental properties in ${searchQuery.location} within the budget of ${searchQuery.budget} allowing the occupancy of ${searchQuery.individuals} with the availability to move in on ${searchQuery.moveInDate}`;
      setQuery(queryPrompt);
      localStorage.removeItem("searchQuery");
    }

    if (queryPrompt === "") {
      console.log("Query prompt is empty");
      return;
    }
  }, []);

  const handleQuery = async (
    e?: React.FormEvent<HTMLFormElement>,
    prompt = ""
  ) => {
    if (query === "" && prompt === "") {
      return;
    }
    e?.preventDefault();
    setDisabled(true);
    const newChatHistory = [
      ...chatHistory,
      { role: "user", content: prompt != "" ? prompt : query },
    ];
    const newChat = [
      ...chat,
      <UserMessageComponent message={prompt != "" ? prompt : query} />,
    ];
    setChat(newChat);
    setChatHistory(newChatHistory);
    setQuery("");
    const res = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newChatHistory }),
    });
    if (res.ok) {
      setChat([
        ...newChat,
        <AIMessageComponent message={res.body!} history={newChatHistory} />,
      ]);
    }
  };

  const handlePersonalizedQuery = async () => {
    setDisabled(true);
    const newChatHistory = [
      ...chatHistory,
      {
        role: "user",
        content:
          "Show me a very personalized single property based on my previous questions",
      },
    ];
    setChatHistory(newChatHistory);
    const res = await fetch(`${backendUrl}/api/personalized_chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newChatHistory }),
    });
    if (res.ok) {
      setChat([
        ...chat,
        <AIMessageComponent message={res.body!} history={newChatHistory} />,
      ]);
    }
  };

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={75} minSize={45}>
        <Card className="shadow-lg relative rounded-none bg-gray-900 text-gray-100 border-none ">
          <div className="flex flex-col items-center w-full bg-gray-800 top-0 z-[40] absolute">
            <CardHeader className="flex flex-row items-center justify-between p-2 w-full max-w-screen-lg">
              <img src={logo} className="w-[35px] lg:w-[40px]" />
              <div className="flex flex-row gap-2 items-center">
                <div className="flex flex-row justify-center">
                  <Button
                    variant={"ghost"}
                    size={"sm"}
                    onClick={() => setShowFilter(!showFilter)}
                  >
                    <Filter size={25} className={`tour-filter`} />
                  </Button>
                  <Popover
                    open={showMobileSavedProperties}
                    onOpenChange={(v) => setShowMobileSavedProperties(v)}
                  >
                    <PopoverTrigger asChild className="lg:hidden">
                      <Button variant={"ghost"} size={"sm"}>
                        <NotebookPen
                          size={25}
                          className={`${
                            screenWidth.current < 1024
                              ? "tour-saved-properties"
                              : ""
                          }`}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className={`mt-2 w-svw bg-[#1F2937] text-white p-3 `}
                    >
                      {savedProperties.length <= 0 && (
                        <h1>Saved properties will be visible here</h1>
                      )}
                      <div className="flex flex-col gap-3">
                        {savedProperties.map((v) => (
                          <div className="flex flex-row gap-5 group w-full justify-between items-center">
                            <div className="flex flex-col gap-1">
                              <h1 className="break-words">{v.name}</h1>
                              {v.contacted && (
                                <Badge
                                  variant="default"
                                  className="bg-green-400 text-black w-fit hover:bg-green-400"
                                >
                                  Contacted
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-row gap-2">
                              <Button
                                variant={"ghost"}
                                size={"icon"}
                                onClick={() => {
                                  UmamiTrack("share", {
                                    "share-link":
                                      window.location.origin + v.property_tag,
                                  });
                                  navigator.clipboard.writeText(
                                    window.location.origin + v.property_tag
                                  );
                                  toast({
                                    description:
                                      "Property link copied to clipboard",
                                    className:
                                      "bg-green-300 font-semibold text-black",
                                  });
                                }}
                              >
                                <Share2 />
                              </Button>
                              {!v.contacted && (
                                <Button
                                  variant={"ghost"}
                                  size={"icon"}
                                  onClick={() => {
                                    if (auth) {
                                      setContactUrl(v.url);
                                      setShowContactAgent(true);
                                    } else {
                                      setShowLoginAuth(true);
                                    }
                                  }}
                                >
                                  <MessageCircle />
                                </Button>
                              )}
                              <Button
                                variant={"ghost"}
                                size={"icon"}
                                onClick={() => {
                                  delete_saved_property(v.url);
                                }}
                              >
                                <Trash />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {savedProperties.length > 0 && (
                        <div className="flex flex-row gap-2">
                          <CompareButton />
                          <Button
                            className="mt-3 w-full bg-[#0073EC] hover:bg-blue-700 font-bold"
                            onClick={() => setShowShare(true)}
                          >
                            Share
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  <Button
                    size={"sm"}
                    onClick={() => setShowMap(!showMap)}
                    className="bg-transparent lg:hidden"
                  >
                    {showMap ? (
                      <Bot size={25} />
                    ) : (
                      <MapIcon
                        size={25}
                        className={`${
                          screenWidth.current < 1024 ? "tour-map" : ""
                        }`}
                      />
                    )}
                  </Button>
                </div>
                {auth ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"ghost"} size={"default"}>
                        <UserCircle size={35} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="mt-2 w-fit p-0">
                      <Button
                        className="bg-[#1F2937]"
                        onClick={() => {
                          document.cookie = "auth=false";
                          document.cookie = "auth_verified=false";
                          setSavedProperties([]);
                          setAuth(false);
                          window.location.reload();
                        }}
                      >
                        Logout
                      </Button>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Button
                    className="text-md font-semibold bg-[#0073EC] hover:bg-blue-700 tour-register"
                    onClick={() => setShowLoginAuth(true)}
                  >
                    Get Started
                  </Button>
                )}
              </div>
            </CardHeader>
          </div>
          <APIProvider apiKey={"AIzaSyAuyFKDkGRy9n7JrJFcPtCkHc-CgMe_xZg"}>
            <Map
              className={`pt-16 h-dvh ${showMap ? "" : "hidden"}`}
              defaultZoom={10}
              defaultCenter={{ lat: 51.500521, lng: -0.1328839 }}
              gestureHandling={"greedy"}
            />
            <CustomMapControl
              controlPosition={ControlPosition.TOP_CENTER}
              onPlaceSelect={(m) => {
                setLatitude(0);
                setLongitude(0);
                setSelectedPlace(m);
              }}
            />
            <MapHandler
              place={selectedPlace}
              latitude={latitude}
              longitude={longitude}
            />
          </APIProvider>
          <CardContent className="p-0 flex flex-col h-dvh rounded-none">
            <ScrollArea
              className="flex-1 px-4 pt-20 pb-16 overflow-auto my-scroll-area lg:mt-2"
              // viewportRef={viewportRef}
              // autoScroll={viewportAutoScroll}
            >
              {chat}
            </ScrollArea>
            {chatHistory.length == 0 && (
              <ScrollArea className="w-11/12 place-self-center overflow-auto tour-examples">
                <div className="mb-20 flex flex-row gap-3 w-max">
                  {examples.map((i) => (
                    <a
                      href="#"
                      className="flex"
                      onClick={() => {
                        UmamiTrack("examples-chat", { "example-prompt": i });
                        handleQuery(undefined, i);
                      }}
                    >
                      <Card className="bg-[#1F2937] border-none text-white text-center w-[250px] p-3">
                        <CardContent className="p-0 text-sm">{i}</CardContent>
                      </Card>
                    </a>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
            <form
              className={`flex gap-2 bottom-5 max-w-[370px] md:max-w-screen-md w-full ${
                showMap ? "" : "fixed"
              } bg-gray-900 place-self-center items-end tour-input`}
              onSubmit={(e) => {
                UmamiTrack("chat", {
                  "chat-prompt": query,
                });
                handleQuery(e);
              }}
            >
              <div className="w-full flex flex-col gap-2 h-full">
                {savedProperties.length > 0 &&
                  query.lastIndexOf("@") !== -1 &&
                  query.lastIndexOf("@") === query.length - 1 && (
                    <ScrollArea
                      className={`${
                        savedProperties.length > 3 ? "h-[200px]" : "h-fit"
                      }  overflow`}
                    >
                      <div className=" flex flex-col gap-3 p-5 rounded-lg bg-[#1F2937]">
                        {savedProperties.map((i) => (
                          <a
                            href="#"
                            className="flex p-1"
                            onClick={() => {
                              setQuery(
                                query.substring(0, query.lastIndexOf("@")) +
                                  i.name
                              );
                            }}
                          >
                            <h1 className="cursor-pointer">{i.name}</h1>
                          </a>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                <Input
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-800 text-white placeholder:text-white"
                  value={query}
                  onChange={(v) => setQuery(v.target.value)}
                  disabled={disabled}
                />
              </div>
              {disabled ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-100"
                  onClick={(e) => {
                    e.preventDefault();
                    stopChat.current = true;
                  }}
                >
                  <CircleStop className="w-5 h-5" />
                  <span className="sr-only">Stop</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  type="submit"
                >
                  <SendHorizonal className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full tour-personalize"
                onClick={(e) => {
                  e.preventDefault();
                  if (!recording) {
                    startRecording();
                  } else {
                    stopRecording();
                  }
                }}
              >
                {!recording ? (
                  <Mic className="w-5 h-5" />
                ) : recordingLoading ? (
                  <Loader2 className={`h-5 w-5 animate-spin block`} />
                ) : (
                  <h1>{recordingTime}</h1>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={chatHistory.length < 10}
                className="rounded-full tour-personalize"
                onClick={(e) => {
                  e.preventDefault();
                  handlePersonalizedQuery();
                }}
              >
                <Sparkles className="w-5 h-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
        <Dialog
          open={showLoginAuth}
          onOpenChange={() => {
            setShowLoginAuth(!showLoginAuth);
            loginForm.reset();
          }}
        >
          <DialogContent className="bg-[#1F2937] border-none">
            <DialogHeader>
              <DialogTitle className="text-white font-bold text-2xl">
                Login
              </DialogTitle>
            </DialogHeader>
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onSubmitLogin)}
                className="space-y-4 mt-5"
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="mt-5 bg-[#0073EC] hover:bg-blue-700"
                >
                  <Loader2
                    className={`mr-2 h-4 w-4 animate-spin ${
                      inProgress ? "block" : "hidden"
                    }`}
                  />
                  Submit
                </Button>
                <a
                  href="#"
                  onClick={() => {
                    setShowLoginAuth(false);
                    setShowRegisterAuth(true);
                  }}
                  className="text-sm text-muted block hover:underline"
                >
                  Don't have any account? Register Now
                </a>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={showRegisterAuth}
          onOpenChange={() => {
            setShowRegisterAuth(!showRegisterAuth);
            registerForm.reset();
          }}
        >
          <DialogContent className="bg-[#1F2937] border-none">
            <DialogHeader>
              <DialogTitle className="text-white font-bold text-2xl">
                Register
              </DialogTitle>
            </DialogHeader>
            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onSubmitRegister)}
                className="space-y-4 mt-5"
              >
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="mt-5 bg-[#0073EC] hover:bg-blue-700"
                >
                  <Loader2
                    className={`mr-2 h-4 w-4 animate-spin ${
                      inProgress ? "block" : "hidden"
                    }`}
                  />
                  Submit
                </Button>
                <a
                  href="#"
                  className="text-sm text-muted block hover:underline"
                  onClick={() => {
                    setShowRegisterAuth(false);
                    setShowLoginAuth(true);
                  }}
                >
                  Already have an account? Login
                </a>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={showContactAgent}
          onOpenChange={() => {
            setShowContactAgent(!showContactAgent);
            contactAgentForm.reset();
          }}
        >
          <DialogContent className="bg-[#1F2937] border-none">
            <DialogHeader>
              <DialogTitle className="text-white font-bold text-2xl">
                Contact Agent
              </DialogTitle>
            </DialogHeader>
            <Form {...contactAgentForm}>
              <form
                onSubmit={contactAgentForm.handleSubmit(contact_agent)}
                className="space-y-4 mt-5"
              >
                <FormField
                  control={contactAgentForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Name</FormLabel>
                      <FormControl>
                        <Input
                          type="name"
                          placeholder="Enter your name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactAgentForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactAgentForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Message" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="mt-5 bg-[#0073EC] hover:bg-blue-700"
                >
                  <Loader2
                    className={`mr-2 h-4 w-4 animate-spin ${
                      inProgress ? "block" : "hidden"
                    }`}
                  />
                  Submit
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={showOtp}
          onOpenChange={() => {
            setShowOtp(!showOtp);
            otpForm.reset();
          }}
        >
          <DialogContent className="bg-[#1F2937] border-none">
            <DialogHeader>
              <DialogTitle className="text-white font-bold text-2xl">
                Verification
              </DialogTitle>
            </DialogHeader>
            <Form {...otpForm}>
              <form
                onSubmit={otpForm.handleSubmit(otpVerification)}
                className="space-y-4 mt-5"
              >
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        One-Time Password
                      </FormLabel>
                      <FormControl>
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormDescription className="text-white">
                        Please enter the one-time password sent to your email.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="mt-5 bg-[#0073EC] hover:bg-blue-700"
                >
                  <Loader2
                    className={`mr-2 h-4 w-4 animate-spin ${
                      inProgress ? "block" : "hidden"
                    }`}
                  />
                  Submit
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={showFilter}
          onOpenChange={() => {
            setShowFilter(!showFilter);
          }}
        >
          <DialogContent className="bg-[#1F2937] border-none">
            <DialogHeader>
              <DialogTitle className="text-white font-bold text-2xl">
                Filter Properties
              </DialogTitle>
            </DialogHeader>
            <div>
              <FilterComponent />
              <Button
                className="mt-3 w-full bg-[#1D4ED8]"
                onClick={() => filterApply()}
                disabled={disabled}
              >
                Apply
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={showShare}
          onOpenChange={() => {
            setShowShare(!showShare);
          }}
        >
          <DialogContent className="bg-[#1F2937] border-none">
            <DialogHeader>
              <DialogTitle className="text-white font-bold text-2xl">
                Share Properties
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col mt-5">
              <ScrollArea className="h-[500px]">
                <div className="flex flex-col gap-5">
                  {savedProperties.map((i) => (
                    <div className="flex items-center space-x-3 text-white">
                      <Checkbox
                        id={i.property_tag}
                        className="border-white"
                        onCheckedChange={() => {
                          if (
                            shareableProperties.current.includes(i.property_tag)
                          ) {
                            shareableProperties.current.splice(
                              shareableProperties.current.indexOf(
                                i.property_tag
                              ),
                              1
                            );
                          } else {
                            shareableProperties.current.push(i.property_tag);
                          }
                        }}
                      />
                      <label
                        htmlFor={i.property_tag}
                        className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 break-words"
                      >
                        {i.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button
                className="bg-[#0073EC] hover:bg-blue-700 font-bold "
                onClick={() => {
                  if (shareableProperties.current.length > 0) {
                    let links = "";
                    for (const tag of shareableProperties.current) {
                      links += `${window.location.origin}${tag}\n`;
                    }
                    UmamiTrack("share", {
                      "share-link": links,
                    });
                    navigator.clipboard.writeText(links);
                    shareableProperties.current = [];
                    setShowShare(false);
                    toast({
                      description: "Property link copied to clipboard",
                      className: "bg-green-300 font-semibold text-black",
                    });
                  } else {
                    toast({
                      variant: "destructive",
                      description: "No properties selected",
                      className: "font-semibold text-white",
                    });
                  }
                }}
              >
                Share
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={showCompareBasis}
          onOpenChange={() => {
            setShowCompareBasis(!showCompareBasis);
          }}
        >
          <DialogContent className="bg-[#1F2937] border-none">
            <DialogHeader>
              <DialogTitle className="text-white font-bold text-2xl">
                Compare properties
              </DialogTitle>
            </DialogHeader>
            <form>
              <div className="flex flex-col gap-3">
                <Label htmlFor="area" className="text-white font-semibold">
                  On basis of their
                </Label>
                <Input
                  placeholder="Budget, Nearby Places, Crime Rate, etc"
                  className="text-black"
                  value={basisQuery}
                  onChange={(v) => setBasisQuery(v.target.value)}
                  required
                />
                <div className="flex flex-row gap-2">
                  <Button
                    className="bg-[#0073EC] hover:bg-blue-700 font-bold w-full"
                    type="submit"
                    disabled={basisQuery.length < 1}
                    onClick={(e) => {
                      e.preventDefault();
                      const properties = savedProperties.map(
                        (i: PropertyModel) => i.name
                      );
                      UmamiTrack("basis-compare", {
                        "basis-compare-prompt":
                          "Compare these properties " +
                          properties.map((item) => `"${item}"`).join(", ") +
                          ` on basis of their ${basisQuery}`,
                      });
                      setShowCompareBasis(false);
                      handleQuery(
                        undefined,
                        "Compare these properties " +
                          properties.map((item) => `"${item}"`).join(", ") +
                          ` on basis of their ${basisQuery}`
                      );
                      setBasisQuery("");
                    }}
                  >
                    Compare
                  </Button>
                  <Button
                    className="bg-[#0073EC] hover:bg-blue-700 font-bold w-full"
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      const properties = savedProperties.map(
                        (i: PropertyModel) => i.name
                      );
                      UmamiTrack("quick-compare", {
                        "quick-compare-prompt":
                          "Compare these properties " +
                          properties.map((item) => `"${item}"`).join(", "),
                      });
                      setShowCompareBasis(false);
                      handleQuery(
                        undefined,
                        "Compare these properties " +
                          properties.map((item) => `"${item}"`).join(", ")
                      );
                      setBasisQuery("");
                    }}
                  >
                    Quick Compare
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Toaster />
      </ResizablePanel>
      <ResizableHandle withHandle className="hidden lg:flex" />
      <ResizablePanel className="hidden lg:block">
        <div className="flex flex-col h-full">
          {
            // <div
            //   className="h-[20%] bg-[#111827] p-2 flex flex-col gap-2"
            //   onDrop={(e) => {
            //     save_user_requested_properties(e.dataTransfer.getData("text"));
            //   }}
            //   onDragOver={(e) => {
            //     e.preventDefault();
            //   }}
            // >
            //   {userRequestedProperties.length === 0 && (
            //     <h1 className="text-white text-center mt-10 text-sm h-[50%]">
            //       Drop properties here that you like and want to contact the agent
            //       about!
            //     </h1>
            //   )}
            //   {userRequestedProperties.length !== 0 && (
            //     <ScrollArea className="h-full ">
            //       {userRequestedProperties.map((v) => (
            //         <div className="flex flex-row gap-5 group w-full justify-between items-center text-white p-2 hover:bg-slate-700 rounded-lg hover:shadow-md">
            //           <h1>{v.name}</h1>
            //           <div className="flex flex-row gap-2">
            //             <Button
            //               variant={"ghost"}
            //               size={"icon"}
            //               onClick={() => {
            //                 if (auth) {
            //                   setContactUrl(v.url);
            //                   setShowContactAgent(true);
            //                 } else {
            //                   setShowLoginAuth(true);
            //                 }
            //               }}
            //             >
            //               <MessageCircle />
            //             </Button>
            //             <Button
            //               variant={"ghost"}
            //               size={"icon"}
            //               onClick={() => {
            //                 delete_user_requested_property(v.url);
            //               }}
            //             >
            //               <Trash />
            //             </Button>
            //           </div>
            //         </div>
            //       ))}
            //     </ScrollArea>
            //   )}
            // </div>
          }
          <div className="h-[50%] bg-[#111827] tour-saved-properties">
            <div className="bg-[#1F2937] text-center p-2">
              <h1 className="text-white">Saved Properties</h1>
            </div>
            <div
              className="h-[75%]"
              onDrop={(e) => {
                save_properties(e.dataTransfer.getData("text"));
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
            >
              {savedProperties.length === 0 && (
                <h1 className="text-white text-center p-20 text-sm h-[50%]">
                  Drop properties here that you liked!
                </h1>
              )}
              <ScrollArea className="h-full border-b border-b-slate-500">
                {savedProperties.map((v) => (
                  <div className="flex flex-row gap-5 group w-full justify-between items-center text-white p-2 ">
                    <div className="flex flex-col gap-1">
                      <h1 className="break-words">{v.name}</h1>
                      {v.contacted && (
                        <Badge
                          variant="default"
                          className="bg-green-400 text-black w-fit hover:bg-green-400"
                        >
                          Contacted
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-row gap-2">
                      <Button
                        variant={"ghost"}
                        size={"icon"}
                        onClick={() => {
                          UmamiTrack("share", {
                            "share-link":
                              window.location.origin + v.property_tag,
                          });
                          navigator.clipboard.writeText(
                            window.location.origin + v.property_tag
                          );
                          toast({
                            description: "Property link copied to clipboard",
                            className: "bg-green-300 font-semibold text-black",
                          });
                        }}
                      >
                        <Share2 />
                      </Button>
                      {!v.contacted && (
                        <Button
                          variant={"ghost"}
                          size={"icon"}
                          onClick={() => {
                            if (auth) {
                              setContactUrl(v.url);
                              setShowContactAgent(true);
                            } else {
                              setShowLoginAuth(true);
                            }
                          }}
                        >
                          <MessageCircle />
                        </Button>
                      )}
                      <Button
                        variant={"ghost"}
                        size={"icon"}
                        onClick={() => {
                          delete_saved_property(v.url);
                        }}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
            {savedProperties.length > 0 && (
              <div className="w-full flex justify-end pr-2 gap-5">
                <CompareButton />
                <Button
                  className="mt-2 bg-[#0073EC] hover:bg-blue-700 font-bold"
                  onClick={() => setShowShare(true)}
                >
                  Share
                </Button>
              </div>
            )}
          </div>
          <APIProvider apiKey={"AIzaSyAuyFKDkGRy9n7JrJFcPtCkHc-CgMe_xZg"}>
            <Map
              reuseMaps={true}
              className="h-[50%] tour-map"
              defaultZoom={10}
              defaultCenter={{ lat: 51.500521, lng: -0.1328839 }}
              gestureHandling={"greedy"}
            />
            <CustomMapControl
              controlPosition={ControlPosition.TOP_CENTER}
              onPlaceSelect={(m) => {
                setLatitude(0);
                setLongitude(0);
                setSelectedPlace(m);
              }}
            />
            <MapHandler
              place={selectedPlace}
              latitude={latitude}
              longitude={longitude}
            />
          </APIProvider>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
